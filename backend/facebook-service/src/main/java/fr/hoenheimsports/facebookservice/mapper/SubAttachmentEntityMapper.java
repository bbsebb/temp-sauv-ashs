package fr.hoenheimsports.facebookservice.mapper;

import fr.hoenheimsports.facebookservice.controller.dto.SubAttachmentDTOResponse;
import fr.hoenheimsports.facebookservice.feignClient.dto.SubAttachmentDTO;
import fr.hoenheimsports.facebookservice.feignClient.dto.SubAttachmentsDTO;
import fr.hoenheimsports.facebookservice.model.SubAttachmentEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = MappingConstants.ComponentModel.SPRING, uses = {MediaEmbeddableMapper.class, TargetEmbeddableMapper.class, AttachmentEntityMapper.class})
public interface SubAttachmentEntityMapper {
    SubAttachmentEntity toEntity(SubAttachmentDTO subAttachmentDTO);

    default List<SubAttachmentEntity> map(SubAttachmentsDTO dto) {
        if (dto == null || dto.data() == null) {
            return new ArrayList<>();
        }
        return dto.data().stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    SubAttachmentDTOResponse toDto(SubAttachmentEntity subAttachmentEntity);

}